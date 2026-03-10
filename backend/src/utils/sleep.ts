export async function sleepRandom() {
  const delay = Math.random() * 900000 + 300000;

  return new Promise(resolve =>
    setTimeout(resolve, delay)
  );
}