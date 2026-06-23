import axios from 'axios';
axios.get('http://localhost:5000/api/football/fifa-rankings/men')
.then(res => console.log('SUCCESS', res.data.data.length))
.catch(e => console.error(e.response ? e.response.data : e.message));
