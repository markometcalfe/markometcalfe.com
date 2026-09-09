export function usePlayPageMeta() {
  const store = usePlayLobbyStore();

  const effectiveGame = computed(
    () => store.startedGame ?? store.selectedGame,
  );

  const pageTitle = computed(() => {
    if (effectiveGame.value === "countries") {
      return "Country Guesser";
    }
    if (effectiveGame.value === "doodle") {
      return "Doodle";
    }
    return "Games";
  });

  useSeoMeta({
    title: () => `${pageTitle.value} - Marko Metcalfe`,
    ogTitle: `Games - Marko Metcalfe`,
    description: "Invite others to play Country Guesser or Doodle",
    ogDescription: "Invite others to play Country Guesser or Doodle",
    ogImage: "https://markometcalfe.com/games-social-card.jpg?v=1",
  });

  return { effectiveGame, pageTitle };
}
