<template>
  <PageCard back-button-page="/visuals">
    <template #title> Edit Shapes </template>

    <DropdownSelect
      v-model="selectedShapeIndex"
      :options="geometryItems"
    />

    <div v-if="selectedShape" class="editshapes-settings">
      <DropdownSelect
        v-model="selectedShape.type"
        label="Type"
        :options="geometryTypes"
      />

      <TextField v-model="selectedShape.color" label="Colour" />

      <div class="editshapes-toggles">
        <ToggleSwitch v-model="selectedShape.solid" label="Solid" />

        <ToggleSwitch
          v-model="selectedShape.reverseRotation"
          label="Reverse Rotation"
        />
      </div>

      <TextField
        label="Radius"
        type="number"
        :model-value="selectedShape.radius.toFixed(0)"
        @update:model-value="updateSelectedShapeRadius"
      />

      <TextField
        v-model="selectedShape.detail"
        label="Detail"
        type="number"
      />
    </div>

    <div class="editshapes-buttons">
      <LinkButton text="Add" @click="addShape">
        <Icon name="bx:plus" />
      </LinkButton>
      <LinkButton
        text="Delete"
        :style="{
          visibility:
            visualsStore.geometryConfig.length > 1
              ? undefined
              : 'hidden',
        }"
        @click="deleteShape"
      >
        <Icon name="bx:trash-alt" />
      </LinkButton>
      <LinkButton text="Save" @click="save">
        <Icon name="bx:save" />
      </LinkButton>
    </div>
  </PageCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  type GeometryAttributes,
  geometryClasses,
} from "@visuals/util/geometry";
import { getColorName } from "@visuals/util/color";

useSeoMeta({
  title: "Edit Shapes - Marko Metcalfe",
  ogTitle: "Edit Shapes - Marko Metcalfe",
  description: "Interactive graphics generated live in the browser",
  ogDescription: "Interactive graphics generated live in the browser",
  ogImage: "https://markometcalfe.com/visuals-social-card.jpg?v=1",
});

const visualsStore = useVisualsStore();

const loading = ref(false);
const selectedShapeIndex = ref(0);

const selectedShape = computed(() => {
  return visualsStore.geometryConfig[selectedShapeIndex.value];
});

const geometryItems = computed(() => {
  return visualsStore.geometryConfig.map((geometry, index) => ({
    value: index,
    label: getShapeName(geometry),
  }));
});

const geometryTypes = computed(() => {
  return geometryClasses.map(geometryClass => ({
    value: geometryClass.getName(),
    label: geometryClass.getName(),
  }));
});

const getShapeName = (shape: GeometryAttributes): string => {
  return `${getColorName(shape.color)} ${shape.type}`;
};

const addShape = (): void => {
  visualsStore.addRandomGeometryConfig();
  selectedShapeIndex.value = visualsStore.geometryConfig.length - 1;
};

const deleteShape = (): void => {
  const shapeToDelete = selectedShapeIndex.value;
  if (selectedShapeIndex.value > 0) {
    selectedShapeIndex.value = selectedShapeIndex.value - 1;
  }
  visualsStore.deleteGeometryConfig(shapeToDelete);
};

const save = (): void => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 250);
  visualsStore.generateGeometry();
};

const updateSelectedShapeRadius = (radius: string | number): void => {
  if (!selectedShape.value) {
    return;
  }
  selectedShape.value.radius = parseFloat(radius.toString());
};

onMounted(() => {
  visualsStore.setListener("onRandomise", () => {
    selectedShapeIndex.value = 0;
  });
});

onUnmounted(() => {
  visualsStore.removeListener("onRandomise");
});
</script>

<style lang="scss">
.editshapes {
  &-settings {
    padding: 1rem 0;

    & > * {
      padding: 0.5rem 0;
    }
  }

  &-buttons,
  &-toggles {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }
}
</style>
