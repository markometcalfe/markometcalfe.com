<template>
  <div>
    <NuxtPage />
    <DynamicBackground v-if="showDynamicBackground" />
    <a id="seo-link" href="https://www.instagram.com/markus_vizshun/"
      >@markus_vizshun</a
    >
  </div>
</template>

<script setup lang="ts">
const showDynamicBackground = useDynamicBackgroundVisible();

useSeoMeta({
  title: "Marko Metcalfe",
  ogTitle: "Marko Metcalfe",
  description: "Marko Metcalfe: Developer & Visual Artist",
  ogDescription: "Marko Metcalfe: Developer & Visual Artist",
  ogImage: "https://markometcalfe.com/social-card.jpg?v=6",
});

onMounted(() => {
  void nextTick(() => {
    document.getElementById("seo-link")?.remove();
  });
});
</script>

<style lang="scss">
@use "/variables" as vars;

:root {
  --color-dark: #000;
  --color-light: #fff;
  --color-highlight: #0f0;
  --color-error: #f00;
  --color-disabled: #aaa;
}

body {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  margin: 0;
  font-family: Inter, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-weight: 300;
  color: var(--color-light);
  background-color: var(--color-dark);
  overflow-x: hidden;

  @include vars.desktop-only {
    font-size: 1rem;
  }

  @include vars.mobile-only {
    font-size: 0.9rem;
  }
}

/* stylelint-disable-next-line selector-id-pattern */
#__nuxt {
  min-height: 100vh;
}

a,
button,
input,
span,
div,
main,
section,
header,
footer,
aside {
  font-weight: inherit;
  font-size: inherit;
  font-family: inherit;
  margin: 0;
  padding: 0;
}

a,
a:visited,
button {
  color: var(--color-highlight);
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  text-decoration: none;
  transition:
    color 250ms,
    border 250ms;
}

a:hover,
a:focus,
button:hover:not(:disabled),
button:focus:not(:disabled) {
  color: inherit;
  cursor: pointer;
}

.dark {
  color: var(--color-dark);
}

.light {
  color: var(--color-light);
}

.highlight {
  color: var(--color-highlight);
}

.success {
  color: var(--color-highlight);
}

.error {
  color: var(--color-error);
}

::selection {
  background: var(--color-highlight);
  color: var(--color-dark);
}

.no-padding {
  padding: 0;
  margin: 0;
}

.disabled {
  opacity: 0.6;
  cursor: unset;
}

.disabled .disabled {
  opacity: 1;
  cursor: auto;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

#seo-link {
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

/* Transition Animations */
.slide-left-enter-from,
.slide-right-leave-to {
  transform: translateX(-100vw);
}

.slide-left-leave-to,
.slide-right-enter-from {
  transform: translateX(100vw);
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.5s ease;
  max-height: 100vh;
  overflow-y: hidden;
}
</style>
