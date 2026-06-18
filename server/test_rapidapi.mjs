import axios from 'axios';

async function testRapidApi() {
    const options = {
        method: 'GET',
        url: 'https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/148404/comm',
        headers: {
            'x-rapidapi-key': '982d5ee668msh085573a4a340b18p114ab3jsn335eb6f0210c',
            'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        const data = response.data;
        if (data.commentaryList) {
            console.log('Found commentaryList length:', data.commentaryList.length);
        } else if (Array.isArray(data.commentary)) {
            console.log('Found commentary length:', data.commentary.length);
        } else {
            console.log('comwrapper?', !!data.comwrapper);
            console.log(JSON.stringify(data).substring(0, 500));
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}
testRapidApi();
