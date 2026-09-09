<template>
  <PageCard back-button-page="/sequencer">
    <template #title> Edit Synths </template>

    <div v-if="sequencerStore.allSynths" class="editsynths">
      <div class="editsynths-select">
        <DropdownSelect
          v-model="selectedSynthId"
          :options="synthOptions"
        />

        <LinkButton
          v-if="selectedSynthId"
          title="Copy"
          @click="copySynth"
        >
          <Icon name="bx:copy" />
        </LinkButton>

        <LinkButton
          v-if="selectedSynth?.canDelete()"
          title="Delete"
          @click="deleteSynth"
        >
          <Icon name="bx:trash-alt" />
        </LinkButton>
      </div>

      <div v-if="selectedSynth" class="editsynths-settings">
        <TextField v-model="selectedSynth.name" label="Label" />

        <DropdownSelect
          v-if="selectedSynth.canSetNote()"
          v-model="selectedSynth.note"
          :options="
            Object.entries(notes).map(([value, label]) => ({
              value,
              label,
            }))
          "
          label="Note"
        />

        <RangeSlider
          v-if="selectedSynth.canSetNote() && selectedSynth.octave"
          v-model="selectedSynth.octave"
          :min="1"
          :max="8"
          label="Octave"
        />

        <RangeSlider
          v-model="selectedSynth.duration"
          :min="1"
          :max="64"
          label="Duration"
        />

        <RangeSlider
          v-for="[key, label] in Object.entries({
            attack: 'Attack',
            decay: 'Decay',
            sustain: 'Sustain',
            release: 'Release',
          })"
          :key="key"
          :model-value="
            selectedSynth.getEnvelopeValue(
              key as keyof Synth['envelope'],
            )
          "
          :label="label"
          :min="0.001"
          :max="1"
          :decimal-places="3"
          @update:model-value="
            (value: number) =>
              selectedSynth?.setEnvelopeValue(
                key as keyof Synth['envelope'],
                value,
              )
          "
        />
      </div>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { Synth } from "@sequencer/util/tone/synths";
import { notes } from "@sequencer/util/tone";

useSeoMeta({
  title: "Edit Synths - Marko Metcalfe",
  ogTitle: "Edit Synths - Marko Metcalfe",
  description: "Interactive step sequencer in the browser",
  ogDescription: "Interactive step sequencer in the browser",
  ogImage: "https://markometcalfe.com/sequencer-social-card.jpg?v=1",
});

const sequencerStore = useSequencerStore();

onMounted(() => {
  sequencerStore.init();
});

const synthOptions = computed(() =>
  sequencerStore.allSynths
    ? (sequencerStore.allSynths as Synth[]).map(synth => ({
        value: synth.getId(),
        label: synth.name,
      }))
    : [],
);

const selectedSynthId = ref<string>("");

onMounted(() => {
  if (
    sequencerStore.allSynths &&
    sequencerStore.allSynths.length > 0
  ) {
    const firstSynth = sequencerStore.allSynths[0];
    if (firstSynth) {
      selectedSynthId.value = firstSynth.getId();
    }
  }
});

const selectedSynth = computed(() =>
  sequencerStore.getSynth(selectedSynthId.value),
);

const copySynth = (): void => {
  const copy = sequencerStore.copySynth(selectedSynthId.value);
  selectedSynthId.value = copy.getId();
};

const deleteSynth = (): void => {
  sequencerStore.deleteSynth(selectedSynthId.value);
  if (
    sequencerStore.allSynths &&
    sequencerStore.allSynths.length > 0
  ) {
    const lastIndex = sequencerStore.allSynths.length - 1;
    const lastSynth = sequencerStore.allSynths[lastIndex];
    if (lastSynth) {
      selectedSynthId.value = lastSynth.getId();
    }
  }
};
</script>

<style lang="scss">
.editsynths {
  &-select {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  &-settings {
    padding: 1rem 0;

    & > * {
      padding: 0.5rem 0;
    }
  }
}
</style>
