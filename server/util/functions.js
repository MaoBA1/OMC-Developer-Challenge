export const getUnixSeconds = () => {
  return Math.floor(Date.now() / 1000);
};

export const convertToMilliseconds = (secondes) => {
  return secondes * 1000;
};

export const generateFakeTemperature = (min = 18, max = 28) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
};
