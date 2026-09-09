<template>
  <div class="page-wrapper">
    <iframe
      src="https://plex.markometcalfe.com/minecraft/dynmap"
      title="Map of the Minecraft Server"
      class="mapframe"
    />
    <div class="banner-overlay">
      <span class="light">Server IP: </span
      ><span class="highlight">minecraft.markometcalfe.com</span>
    </div>
  </div>
</template>

<style lang="scss">
@use "/variables" as vars;

.page-wrapper {
  display: flex;
  justify-content: center;
}

.banner-overlay {
  position: absolute;
  background-color: rgb(0 0 0 / 80%);
  border: var(--color-highlight) 1px solid;
  z-index: 10;

  @include vars.desktop-only {
    bottom: 3rem;
    padding: 1rem 2rem;
    font-size: 2rem;
  }

  @include vars.mobile-only {
    bottom: 2rem;
    padding: 0.75rem 1.25rem;
    font-size: 1.25rem;
  }
}

.mapframe {
  width: 100vw;
  height: 100vh;
  border: 0;
}
</style>
