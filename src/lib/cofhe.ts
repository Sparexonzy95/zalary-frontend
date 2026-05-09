export async function getSelfPermit() {
  return {
    ok: true,
    skipped: true,
    reason: "Zalary frontend onboarding does not require a CoFHE self permit in this demo.",
  };
}
