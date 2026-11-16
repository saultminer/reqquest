<script lang="ts">
  import { FieldRadio } from '@txstate-mws/carbon-svelte'
  import type { FutureCommunicationOptIn } from './types.js'
  export let gatheredConfigData
  export let data: Partial<FutureCommunicationOptIn>
</script>

<FieldRadio boolean path="optIn" legendText="Opt into communication for future mentorships available?" items={[{ label: 'Yes', value: true }, { label: 'No', value: false }]} />
