<template>
  <PageCard v-show="!isFullscreen" back-button-page="/">
    <template #title>Visualiser</template>

    <div
      class="visualspage"
      :class="{
        'visualspage--twocolumns': filtersEnabled,
      }"
    >
      <div class="visualspage-buttons">
        <LinkButton
          v-if="!infiniteEnabled"
          text="Randomise"
          @click="visualsStore.randomise"
        >
          <Icon name="bx:shuffle" />
        </LinkButton>
        <LinkButton
          v-if="!infiniteEnabled"
          href="/visuals/shapes"
          text="Edit Shapes"
        >
          <Icon name="bx:pencil" />
        </LinkButton>
        <LinkButton
          v-if="!isMobile()"
          text="Fullscreen"
          @click="requestFullscreen"
        >
          <Icon name="bx:fullscreen" />
        </LinkButton>
      </div>

      <div class="visualspage-settings">
        <div class="visualspage-toggles">
          <ToggleSwitch
            :model-value="visualsStore.infinite.enabled"
            label="Infinite"
            @update:model-value="visualsStore.setInfiniteEnabled"
          />
          <ToggleSwitch
            v-if="!isMobile()"
            v-model="visualsStore.filters.enabled"
            label="Filters"
          />

          <ToggleSwitch
            v-if="!infiniteEnabled && !isMobile()"
            v-model="visualsStore.followCursor"
            label="Follow Cursor"
          />
          <ToggleSwitch
            v-if="!infiniteEnabled && isMobile()"
            v-model="visualsStore.edgeBounce.enabled"
            label="Edge Bounce"
          />

          <ToggleSwitch
            :model-value="visualsStore.beatMatch.enabled"
            label="Beat Matching"
            @update:model-value="visualsStore.setBeatMatchEnabled"
          />
          <ToggleSwitch
            v-model="visualsStore.beatMatch.syncToBar"
            :disabled="!visualsStore.beatMatch.enabled"
            label="Sync To Bar"
          />
          <ToggleSwitch
            v-model="visualsStore.beatMatch.randomizeColors"
            :disabled="!visualsStore.beatMatch.enabled"
            label="Colour Changes"
          />
        </div>

        <div class="visualspage-faders">
          <BpmFader :disabled="!visualsStore.beatMatch.enabled" />

          <template v-if="filtersEnabled">
            <RangeSlider
              v-model="visualsStore.filters.brightness"
              :min="0"
              :max="400"
              label="Brightness"
            />
            <RangeSlider
              v-model="visualsStore.filters.contrast"
              :min="0"
              :max="400"
              label="Contrast"
            />
            <RangeSlider
              v-model="visualsStore.filters.saturate"
              :min="0"
              :max="400"
              label="Saturation"
            />
            <RangeSlider
              v-model="visualsStore.filters.blur"
              :min="0"
              :max="100"
              label="Blur"
            />
          </template>

          <template v-if="infiniteEnabled">
            <RangeSlider
              v-model="visualsStore.autoZoom.speed"
              :min="1"
              :max="50"
              label="Zoom Speed"
            />
            <RangeSlider
              v-model="visualsStore.infinite.popInDistance"
              :min="1"
              :max="50"
              label="Pop-In Distance"
            />
            <RangeSlider
              v-model="visualsStore.infinite.shapeSpacing"
              :min="5"
              :max="20"
              label="Shape Spacing"
            />
          </template>

          <template v-else>
            <DropdownSelect
              v-model="visualsStore.autoZoom.mode"
              :options="autoZoomOptions"
              label="Auto Zoom Mode"
            />
            <RangeSlider
              v-model="visualsStore.zoom.current"
              :min="-10"
              :max="20"
              :decimal-places="2"
              label="Current Zoom"
            />
            <RangeSlider
              v-model="visualsStore.zoom.min"
              :disabled="autoZoomDisabled"
              :min="-10"
              :max="20"
              label="Min Zoom"
            />
            <RangeSlider
              v-model="visualsStore.zoom.max"
              :disabled="autoZoomDisabled"
              :min="-10"
              :max="20"
              label="Max Zoom"
            />
            <RangeSlider
              v-model="visualsStore.autoZoom.speed"
              :disabled="!autoZoomIsSmooth"
              :min="0"
              :max="100"
              label="Zoom Speed"
            />
          </template>

          <RangeSlider
            v-model="visualsStore.rotationSpeed.x"
            :min="0"
            :max="100"
            :label="
              isMobile() ? 'X Rotation' : 'X-Axis Rotation Speed'
            "
          />

          <RangeSlider
            v-model="visualsStore.rotationSpeed.y"
            :min="0"
            :max="100"
            :label="
              isMobile() ? 'Y Rotation' : 'Y-Axis Rotation Speed'
            "
          />
        </div>
      </div>

      <ul v-if="!isMobile()" class="visualspage-footnote">
        <template v-if="!infiniteEnabled">
          <ListItem>Scroll to Zoom In & Out</ListItem>
          <ListItem>Click to Randomise Shapes</ListItem>
        </template>
        <ListItem>Space to Beatmatch BPM</ListItem>
        <ListItem>Shift to Change Colours</ListItem>
      </ul>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { isMobile } from "is-mobile";
import { AutoZoomMode } from "@visuals/stores/visuals";

useSeoMeta({
  title: "Visualiser - Marko Metcalfe",
  ogTitle: "Visualiser - Marko Metcalfe",
  description: "Interactive graphics generated live in the browser",
  ogDescription: "Interactive graphics generated live in the browser",
  ogImage: "https://markometcalfe.com/visuals-social-card.jpg?v=1",
});

const visualsStore = useVisualsStore();

const isFullscreen = ref(false);

const autoZoomOptions = computed(() => {
  const options = visualsStore.beatMatch.enabled
    ? Object.values(AutoZoomMode)
    : [AutoZoomMode.DISABLED, AutoZoomMode.SMOOTH];
  return options.map(value => ({
    value,
    label: value,
  }));
});

const filtersEnabled = computed(() => visualsStore.filters.enabled);

const infiniteEnabled = computed(() => visualsStore.infinite.enabled);

const autoZoomDisabled = computed(() => {
  return visualsStore.autoZoom.mode === AutoZoomMode.DISABLED;
});

const autoZoomIsSmooth = computed(() => {
  return visualsStore.autoZoom.mode === AutoZoomMode.SMOOTH;
});

const requestFullscreen = (): void => {
  void document.body.requestFullscreen();
};

const fullscreenEvent = (): void => {
  const dynamicBackground = document.querySelector(
    ".dynamicbackground",
  ) as HTMLElement;

  if (isFullscreen.value) {
    isFullscreen.value = false;
    document.body.style.cursor = "";
    dynamicBackground.style.cursor = "";
  } else {
    isFullscreen.value = true;
    document.body.style.cursor = "none";
    dynamicBackground.style.cursor = "none";
  }
};

onMounted(() => {
  document.addEventListener("fullscreenchange", fullscreenEvent);
});

onUnmounted(() => {
  document.removeEventListener("fullscreenchange", fullscreenEvent);
  document.body.style.cursor = "auto";
});
</script>

<style lang="scss">
@use "/variables" as vars;

.visualspage {
  &-buttons,
  &-toggles {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 1rem;
    gap: 1rem;
  }

  &-buttons {
    > :only-child {
      margin-inline: auto;
    }
  }

  &-toggles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-bottom: 1rem;
  }

  &--twocolumns {
    .visualspage-buttons {
      justify-content: center;
    }

    .visualspage-toggles {
      display: flex;
      justify-content: space-between;
    }

    .visualspage-faders {
      @include vars.desktop-only {
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 2rem;
      }
    }
  }

  &:not(&--twocolumns) {
    .visualspage-buttons,
    .visualspage-toggles {
      justify-content: space-between;
    }

    .visualspage-toggles {
      & > .toggleswitch:nth-child(odd) {
        flex-direction: row-reverse;
      }
    }
  }

  &-settings,
  &-faders {
    & > * {
      padding: 0.5rem 0;
    }
  }

  &-footnote {
    list-style: inside;
    display: grid;
    justify-items: start;
    margin: 0;
    padding: 0;
    padding-top: 1rem;
    gap: 1rem;
    grid-template-columns: 1fr 1fr;

    @include vars.mobile-only {
      display: none;
    }

    & li {
      padding: 0;
      margin: 0;
      padding-top: 0.5rem;
      font-size: 1rem;
    }
  }
}
</style>
