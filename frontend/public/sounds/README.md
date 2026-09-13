LIFEOS Audio Triggers
=====================

All alert audio is synthesized in real time with the Web Audio API by
`store/useEmergencyStore.ts` (no audio files required):

| Trigger          | Sound          | Where                         |
|------------------|----------------|-------------------------------|
| Step 1 · Crash   | metallic boom  | `audio.playBoom()`            |
| Step 2 · Dispatch| two-tone siren | `audio.playSiren()`           |
| Step 3 · Re-plan | crisp alarm    | `audio.playAlarm()`           |
| Reset / Resolved | chime          | `audio.playChime()`           |

This folder exists to guarantee a production-safe deployment path if the team
ever swaps synthesized audio for branded samples (`.mp3` / `.ogg`).