import axios from 'axios';

async function test() {
    try {
        const res = await axios.get('https://www.fotmob.com/embed/news/01kthd9tykc9/transfer-rumors-real-madrids-olise-boost-liverpool-eye-130m-forward');
        const match = res.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (match) {
            const data = JSON.parse(match[1]);
            const articleData = data.props?.pageProps?.data;
            if (articleData) {
                console.log('src is array?', Array.isArray(articleData.src));
                if (Array.isArray(articleData.src)) {
                    console.log('First element of src:', articleData.src[0]);
                } else {
                    console.log('src is type:', typeof articleData.src);
                    console.log('src keys:', Object.keys(articleData.src || {}));
                    console.log('src:', articleData.src.substring ? articleData.src.substring(0, 500) : articleData.src);
                }
            }
        }
    } catch (e) {
        console.error(e.message);
    }
}

test();
