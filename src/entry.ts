const game = new URLSearchParams(window.location.search).get('game');

if (game === 'jump') {
  void import('./main');
} else {
  void import('./pulse/main');
}
