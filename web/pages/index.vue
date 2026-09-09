<template>
  <PageCard class="home">
    <div class="home-container">
      <section class="home-header">
        <div class="home-header-left">
          <ProfilePhoto />
        </div>
        <div class="home-header-right">
          <h1>Marko Metcalfe</h1>
          <div class="home-header-links">
            <a
              href="https://github.com/markometcalfe"
              title="GitHub"
              target="_blank"
              rel="noopener noreferer"
            >
              <Icon name="bx:bxl-github" />
            </a>
            <a
              href="https://instagram.com/markus_vizshun"
              title="Instagram"
              target="_blank"
              rel="noopener noreferer"
            >
              <Icon name="bx:bxl-instagram" />
            </a>
            <a
              href="https://www.linkedin.com/in/marko-metcalfe/"
              title="LinkedIn"
              target="_blank"
              rel="noopener noreferer"
            >
              <Icon name="bx:bxl-linkedin-square" />
            </a>
            <a
              :href="mailtoLink"
              title="Email"
              target="_blank"
              rel="noopener noreferer"
            >
              <Icon name="bx:envelope" />
            </a>
          </div>
        </div>
      </section>
    </div>

    <SectionBlock title="Me" larger-text>
      I'm a software developer who likes making cool experiences with
      code
    </SectionBlock>

    <SectionBlock title="My Work" grid>
      <LinkButton text="Resume" href="/resume" large>
        <Icon name="bx:file" />
      </LinkButton>
      <LinkButton text="Visualiser" href="/visuals" large>
        <Icon name="custom:octohedron" />
      </LinkButton>
      <LinkButton text="Sequencer" href="/sequencer" large>
        <Icon name="fad:waveform" />
      </LinkButton>
      <LinkButton text="Games" href="/play" large>
        <Icon name="mdi:puzzle-outline" />
      </LinkButton>
    </SectionBlock>
  </PageCard>
</template>

<script setup lang="ts">
const { mailtoLink } = useAppConfig();
</script>

<style lang="scss">
@use "/variables" as vars;

.home {
  & .pagecard-inner {
    padding: 0;
    margin: 1rem;
  }

  &-container {
    @include vars.desktop-only {
      padding: 1rem 0;
    }

    @include vars.mobile-only {
      padding-bottom: 0.5rem;
    }
  }

  &-header {
    display: flex;
    gap: 1rem;

    &-left,
    &-right {
      display: flex;
      flex-direction: column;

      @include vars.desktop-only {
        justify-content: space-between;
      }

      @include vars.mobile-only {
        justify-content: space-around;
        gap: 0.5rem;
      }
    }

    & h1 {
      display: block;
      position: relative;
      z-index: 100;
      text-transform: lowercase;
      font-weight: 500;
      transform-origin: left center;
      margin: 0;
      text-align: left;

      @include vars.desktop-only {
        font-size: 5rem;
        line-height: 3.3rem;
        letter-spacing: -8px;
        transform: scale(1, 0.9);
      }

      @include vars.mobile-only {
        font-size: 3.25rem;
        line-height: 2.15rem;
        letter-spacing: -5px;
        transform: scale(1, 0.95);
      }
    }

    &-right {
      & ul {
        justify-content: space-between;
      }

      @include vars.desktop-only {
        width: 280px;
      }

      @include vars.mobile-only {
        width: 180px;
      }

      & h1 {
        word-spacing: 1px;
      }
    }

    &-links {
      display: flex;
      gap: 1rem;

      a {
        color: var(--color-light);

        @include vars.desktop-only {
          font-size: 2rem;
        }

        @include vars.mobile-only {
          font-size: 1.75rem;
        }

        &:hover {
          color: var(--color-highlight);
        }
      }
    }
  }
}
</style>
