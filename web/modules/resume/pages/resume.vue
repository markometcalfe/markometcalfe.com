<template>
  <PageCard back-button-page="/" longform>
    <template #title> Resume </template>
    <template #titleright>
      <LinkButton
        text="PDF"
        title="Download as a PDF"
        href="https://markometcalfe.com/resume.pdf"
        large
        external
      >
        <Icon name="bx:download" />
      </LinkButton>
    </template>
    <ResumeSection title="Experience">
      <ResumeEntry
        v-for="experience in resume?.experience"
        :key="experience.dates"
      >
        <template #left>
          <p>
            <strong>{{ experience.organisation }}</strong>
          </p>
          <p>
            <strong
              ><em>{{ experience.position }}</em></strong
            >
          </p>
          <p>
            <span>{{ experience.dates }}</span>
          </p>
        </template>
        <template #right>
          <p>{{ experience.summary }}</p>
          <ul>
            <ListItem
              v-for="item in experience.responsibilities"
              :key="item"
            >
              {{ item }}
            </ListItem>
          </ul>
        </template>
      </ResumeEntry>
    </ResumeSection>
    <ResumeSection title="Skills">
      <ResumeEntry
        v-for="skill in resume?.skills"
        :key="skill.name"
        :left="skill.name"
      >
        {{ skill.description }}
      </ResumeEntry>
    </ResumeSection>
    <ResumeSection title="Education">
      <ResumeEntry
        v-for="education in resume?.education"
        :key="education.institution"
      >
        <template #left>
          <p>
            <strong>{{ education.institution }}</strong>
          </p>
          <p>
            <strong>{{ education.degree }}</strong>
          </p>
          <p>
            <span
              >{{ education.startYear }} –
              {{ education.endYear }}</span
            >
          </p>
        </template>
        <template #right>
          <p>
            {{ education.summary }}
          </p>
          <ul>
            <ListItem v-for="skill in education.skills" :key="skill">
              {{ skill }}
            </ListItem>
          </ul>
        </template>
      </ResumeEntry>
    </ResumeSection>
  </PageCard>
</template>

<script setup lang="ts">
import resumeData, { type Resume } from "@markometcalfe/resume";

const resume = resumeData as unknown as Resume;
</script>
