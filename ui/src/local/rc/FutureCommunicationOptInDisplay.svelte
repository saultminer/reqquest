<script lang="ts">
  import { booleanToWord } from "$internal"
  import type { FutureCommunicationOptIn } from "./types"

  export let data: FutureCommunicationOptIn
</script>
<p class="text-xs">Opt into communication for future mentorships available?</p>
<p>{booleanToWord(data?.optIn)}</p>
