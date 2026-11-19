import { type FormStore, type Feedback, type SubmitResponse } from '@txstate-mws/svelte-forms'
import { get } from 'svelte/store'
import type { StatusReason } from '@reqquest/ui'

/** What api.updatePrompt gives back: the usual form response plus the appRequest's version after the write. */
export interface PromptSaveResponse extends SubmitResponse<any> {
  dataVersion?: number
  /** what each requirement says about the saved prompt; absent on a response the queue made up itself */
  statusReasons?: StatusReason[]
}

/**
 * A queue that runs the reviewer approve screen's prompt saves one at a time. That screen saves from
 * several forms at once - an inline autosave form for each reviewer question, plus the edit modal - and
 * every one of those saves writes the same appRequest row, whose optimistic concurrency is a single
 * dataVersion. Sequencing the saves lets them agree on it: each save carries the version the save ahead
 * of it just returned, instead of the stale one every form started the page with. The API serializes
 * concurrent updates on a FOR UPDATE row lock anyway, so the queue costs no throughput.
 *
 * When a save does come back with a conflict, nothing queued behind it could succeed either - it is all
 * built on a version another session has already moved past - so the queue freezes instead of sending it.
 * Every later save fails locally, replaying the message the API sent us, until the user reloads the page.
 */
export class PromptSaveQueue {
  /** the version every save from this screen carries, kept current from each save's response */
  private version: number | undefined
  private chain: Promise<unknown> = Promise.resolve()
  /** the conflict that froze us, held so later saves can repeat what the API said */
  private conflict: Feedback[] | undefined
  /**
   * The inline forms' FormStores, keyed by prompt id, so drain() can see which ones hold unsaved typing
   * and flush them. Each inline Form registers its own store here with `bind:store={queue.stores[prompt.id]}`.
   */
  stores: Record<string, FormStore<any> | undefined> = {}

  /** true while any inline form holds typing that has not reached the API yet */
  private get hasUnsavedChanges () {
    return Object.values(this.stores).some(store => store != null && get(store).hasUnsavedChanges)
  }

  /**
   * Take the version that came with freshly loaded page data. Two things can make that version the wrong
   * one to take: a refresh that was already in flight when a save landed comes back describing the older
   * version we have since moved past, and a version adopted while a form is dirty would let that form's
   * next save pass the concurrency check with data typed against what somebody else has already replaced -
   * the exact case the check exists to catch. Skip both.
   */
  adopt (version: number | undefined) {
    if (version == null || this.conflict != null) return
    if (this.version != null && version <= this.version) return
    if (this.hasUnsavedChanges) return
    this.version = version
  }

  /**
   * Run a save when the saves ahead of it have settled. The modal pins the version it fetched when it
   * opened and passes it as pinnedVersion, because the data it is editing is that version's data no matter
   * what has been saved since.
   */
  async save (send: (dataVersion?: number) => Promise<PromptSaveResponse>, pinnedVersion?: number): Promise<PromptSaveResponse> {
    const attempt = this.chain.then(async () => {
      if (this.conflict != null) return { success: false, messages: this.conflict }
      const sent = pinnedVersion ?? this.version
      const response = await send(sent)
      // a save the API refused while reporting a version other than the one we sent is a concurrency
      // conflict; a save it refused on the version we sent is just bad data and we can try again
      if (response.success) this.version = response.dataVersion ?? this.version
      else if (sent != null && response.dataVersion != null && response.dataVersion !== sent) this.conflict = response.messages
      return response
    })
    this.chain = attempt.catch(() => {}) // a save that throws must not break the chain for the saves behind it
    return await attempt
  }

  /**
   * Empty the queue: save any inline form that is holding typing, then wait for everything in flight to
   * settle. Calling submit directly cancels the form's autosave debounce and saves immediately, so a
   * reviewer who types and then opens the modal within the debounce window still gets a modal pinned to a
   * version that includes what they typed.
   *
   * A form whose save fails still counts as settled - it round-tripped and came back with feedback, so it
   * cannot stall us here; it simply stays unsaved and carries whatever version we hold when the user fixes it.
   */
  async drain () {
    for (const store of Object.values(this.stores)) {
      if (store != null && get(store).hasUnsavedChanges) await store.submit({ autoSave: true })
    }
    let settled: Promise<unknown>
    do {
      settled = this.chain
      await settled
    } while (settled !== this.chain)
  }
}
