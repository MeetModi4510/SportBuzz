import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
    try {
        const res = await axios.get('https://www.fotmob.com/embed/news/01kthd9tykc9/transfer-rumors-real-madrids-olise-boost-liverpool-eye-130m-forward');
        const $ = cheerio.load(res.data);
        const paragraphs = [];
        $('p').each((i, el) => {
            paragraphs.push($(el).text().trim());
        });
        console.log('Paragraphs found:', paragraphs.length);
        console.log(paragraphs.filter(p => p.length > 20).slice(0, 3));
    } catch (e) {
        console.error(e.message);
    }
}

test();
