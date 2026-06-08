import axios from 'axios';

async function test() {
    try {
        const res = await axios.get('https://www.fotmob.com/embed/news/01kthd9tykc9/transfer-rumors-real-madrids-olise-boost-liverpool-eye-130m-forward');
        console.log(res.data.substring(0, 500));
        console.log('---');
        console.log('Contains <html>? ', res.data.includes('<html'));
    } catch (e) {
        console.error(e.message);
    }
}

test();
