<template>
  <PageCard back-button-page="/">
    <template #title> Step Sequencer </template>

    <div class="sequencerpage">
      <div class="sequencerpage-buttons">
        <LinkButton
          :title="sequencerStore.isPlaying ? 'Pause' : 'Play'"
          @click="sequencerStore.togglePlay"
        >
          <Icon v-if="sequencerStore.isPlaying" name="fad:pause" />
          <Icon v-else name="fad:play" />
        </LinkButton>

        <LinkButton href="/sequencer/synths" title="Edit Synths">
          <Icon name="bx:pencil" />
        </LinkButton>

        <LinkButton
          title="Clear Grid"
          @click="sequencerStore.resetGrid"
        >
          <Icon name="bx:trash-alt" />
        </LinkButton>
      </div>

      <div class="sequencerpage-options">
        <BpmFader />
      </div>

      <div
        v-if="sequencerStore.grid && synthOptions"
        class="sequencerpage-sequences"
      >
        <div class="sequencerpage-rowoptions">
          <div
            v-for="(row, rowIndex) in sequencerStore.grid"
            :key="'rowoptions-' + rowIndex"
            class="sequencerpage-rowoptions-wrapper"
          >
            <div class="sequencerpage-rowoptions-select">
              <DropdownSelect
                :model-value="row.synthId"
                :options="synthOptions"
                @update:model-value="
                  (id: string | number) => {
                    if (sequencerStore.grid?.[rowIndex]) {
                      sequencerStore.grid[rowIndex].synthId =
                        id.toString();
                    }
                  }
                "
              />
            </div>

            <div class="sequencerpage-rowoptions-buttons">
              <LinkButton
                title="Delete Row"
                :disabled="sequencerStore.gridRowCount < 2"
                @click="sequencerStore.deleteGridRow(rowIndex)"
              >
                <Icon name="bx:trash-alt" />
              </LinkButton>

              <LinkButton
                :title="row.muted ? 'Unmute' : 'Mute'"
                @click="row.muted = !row.muted"
              >
                <Icon v-if="row.muted" name="bx:volume-mute" />
                <Icon v-else name="bx:volume-full" />
              </LinkButton>

              <LinkButton
                title="Sync Visuals"
                :on="row.visualsSynced"
                @click="sequencerStore.syncVisuals(rowIndex)"
              >
                <Icon name="custom:octohedron" />
              </LinkButton>
            </div>
          </div>

          <div class="sequencerpage-rowoptions-wrapper">
            <div class="sequencerpage-rowoptions-select">
              <DropdownSelect
                v-model="synthToAddId"
                :options="synthOptions"
              />
            </div>

            <div class="sequencerpage-rowoptions-buttons">
              <LinkButton
                title="Add Row"
                @click="sequencerStore.addGridRow(synthToAddId)"
              >
                <Icon name="bx:plus" />
              </LinkButton>
            </div>
          </div>
        </div>

        <div class="sequencerpage-grid">
          <div
            v-for="(row, rowIndex) in sequencerStore.grid"
            :key="'row-' + rowIndex"
            class="sequencerpage-row"
          >
            <div
              v-for="(beat, beatIndex) in row.beats"
              :key="'beat-' + beatIndex + '-' + beatIndex"
              :class="[
                'sequencerpage-beat',
                {
                  'sequencerpage-beat-on': beat,
                  'sequencerpage-beat-off': !beat,
                  'sequencerpage-beat-barstart':
                    sequencerStore.isBarStart(beatIndex),
                  'sequencerpage-beat-playing':
                    sequencerStore.isBeatPlaying(beatIndex),
                  'sequencerpage-beat-muted': row.muted,
                },
              ]"
            >
              <button
                @click="row.beats[beatIndex] = !row.beats[beatIndex]"
              />
            </div>
          </div>
        </div>

        <div class="sequencerpage-columnoptions">
          <LinkButton
            title="Add Bar"
            @click="sequencerStore.addBar()"
          >
            <Icon name="bx:plus" />
          </LinkButton>

          <LinkButton
            title="Delete Bar"
            :disabled="sequencerStore.barCount < 2"
            @click="sequencerStore.deleteBar()"
          >
            <Icon name="bx:trash-alt" />
          </LinkButton>
        </div>
      </div>

      <p
        v-if="isIOS && sequencerStore.isPlaying"
        class="sequencerpage-info"
      >
        Nothing playing? Take your phone off silent
      </p>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { isIOS } from "react-device-detect";

useSeoMeta({
  title: "Sequencer - Marko Metcalfe",
  ogTitle: "Sequencer - Marko Metcalfe",
  description: "Interactive step sequencer in the browser",
  ogDescription: "Interactive step sequencer in the browser",
  ogImage: "https://markometcalfe.com/sequencer-social-card.jpg?v=1",
});

const sequencerStore = useSequencerStore();

const synthToAddId = ref("");

const synthOptions = computed(() =>
  sequencerStore.allSynths?.map(synth => ({
    value: synth.getId(),
    label: synth.name,
  })),
);

onMounted(() => {
  sequencerStore.init();
  const firstSynth = sequencerStore.allSynths?.[0];
  if (firstSynth) {
    synthToAddId.value = firstSynth.getId();
  }
});

onUnmounted(() => {
  if (sequencerStore.isPlaying && !sequencerStore.gridHasEntry) {
    sequencerStore.stop();
  }
});
</script>

<style lang="scss">
@use "/variables" as vars;

@mixin sequencer-row {
  @include vars.desktop-only {
    height: 2.25rem;
    padding: 0.5rem 0.25rem;
  }

  @include vars.mobile-only {
    height: 1.25rem;
    padding: 0.25rem 0.15rem;
  }
}

.sequencerpage {
  &-buttons {
    display: flex;
    justify-content: center;

    @include vars.desktop-only {
      gap: 1rem;
      padding-bottom: 1rem;
    }

    @include vars.mobile-only {
      gap: 0.5rem;
      padding-bottom: 0.5rem;
    }
  }

  &-options {
    display: flex;
    justify-content: center;

    @include vars.desktop-only {
      gap: 1rem;
      padding-top: 0.5rem;
      padding-bottom: 1rem;
    }

    @include vars.mobile-only {
      gap: 0.5rem;
      padding-bottom: 0.5rem;
    }
  }

  &-sequences {
    display: flex;
  }

  &-rowoptions {
    display: flex;
    flex-direction: column;

    @include vars.desktop-only {
      padding-right: 0.25rem;
    }

    &-wrapper {
      display: flex;

      @include sequencer-row;
    }

    &-select {
      @include vars.desktop-only {
        min-width: 6rem;
        padding-right: 0.5rem;
      }

      @include vars.mobile-only {
        min-width: 4.5rem;
        padding-right: 0.25rem;

        & .dropdownselect {
          font-size: 0.75rem;
        }

        & .dropdownselect-selected-option {
          padding: 0.2rem 0.5rem;
        }

        & .dropdownselect-option {
          padding: 0.2rem 0.5rem;
        }

        & .dropdownselect-arrow {
          margin-right: 0;
        }
      }
    }

    &-buttons {
      display: flex;

      @include vars.desktop-only {
        gap: 0.5rem;
      }

      @include vars.mobile-only {
        gap: 0.25rem;

        & button {
          padding: 0.45rem;
        }

        & .linkbutton-icon {
          font-size: 0.25rem;
          height: 0.25rem;
          width: 0.25rem;
          transform: scale(2.5);
        }
      }
    }
  }

  &-grid {
    display: flex;
    flex-direction: column;
    overflow-x: auto;

    @include vars.desktop-only {
      max-width: calc(100vw - 285px);
    }

    @include vars.mobile-only {
      max-width: calc(100vw - 200px);
    }
  }

  &-row {
    display: flex;
  }

  &-beat {
    display: flex;

    @include sequencer-row;

    @include vars.desktop-only {
      min-width: 2.75rem;
    }

    @include vars.mobile-only {
      min-width: 1.75rem;
    }

    & button {
      width: 100%;
      height: 100%;
      border: var(--color-light) 1px solid;
      transition: none;
    }

    &-on button {
      background-color: var(--color-highlight);
    }

    &-off button {
      background-color: var(--color-dark);
    }

    &-on.sequencerpage-beat-muted button {
      background-color: var(--color-disabled);
    }

    &-playing {
      background-color: var(--color-light);
    }

    &-barstart {
      @include vars.desktop-only {
        margin-left: 0.5rem;
      }

      @include vars.mobile-only {
        margin-left: 0.25rem;
      }
    }
  }

  &-columnoptions {
    display: flex;
    place-content: center center;
    flex-direction: column;
    gap: 0.5rem;

    @include vars.desktop-only {
      padding-left: 1rem;
    }

    @include vars.mobile-only {
      padding-left: 0.5rem;
    }
  }

  &-info {
    @include vars.desktop-only {
      display: none;
    }

    @include vars.mobile-only {
      font-size: 0.8rem;
      margin-bottom: 0;
    }
  }
}
</style>
