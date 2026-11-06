<script lang="ts">
  export let title: string | undefined = undefined
  export let subtitle: string | undefined = undefined
  export let maxWidth = true
</script>
<div class="progress-nav-outer">
  <div class="progress-nav-inner" class:full-width={!maxWidth}>
    {#if title}<h2>{title}</h2>{/if}
    {#if subtitle}<div class="progress-nav-subtitle">{subtitle}</div>{/if}
    <slot />
  </div>
</div>

<style>
  .progress-nav-outer {
    container-type: inline-size;
  }

  .progress-nav-inner {
    width: min(90%, 800px);
    margin: 0 auto;
  }
  .progress-nav-inner.full-width {
    width: 90%;
  }
  @media (max-width: 600px) {
    .progress-nav-inner {
      width: 100%;
    }
  }

  h2, .progress-nav-subtitle {
    text-align: center;
  }

  h2 {
    font-weight: bold;
    font-size: 1.5rem;
    margin-bottom: 1.2rem;
  }

  .progress-nav-subtitle {
    font-size: 0.9rem;
    margin-bottom: 1.2rem;
  }
</style>
