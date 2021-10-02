const getCourse = async () => {
  const response = await axios.get(`https://blockchain.info/ticker`);
  const data = response.data;
  const usdCourse = data.USD;
  console.log()
  document.querySelector("#field").textContent = `1 ₿ = ${usdCourse.last} $`
} 

const updateFieldValue = async (e) => {
  const number = e.target.value;
  const response = await axios.get(`https://blockchain.info/tobtc?currency=USD&value=${number}`);
  const data = response.data;
  console.log()
  document.querySelector("#exchField").textContent = `${data} ₿`
}


document.querySelector("#getBtnId").addEventListener('click', getCourse);
document.querySelector("#exchangeInput").addEventListener('input', updateFieldValue);