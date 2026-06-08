import axios from 'axios';

async function test() {
    try {
        const res = await axios.get('https://www.fotmob.com/embed/news/01kthd9tykc9/transfer-rumors-real-madrids-olise-boost-liverpool-eye-130m-forward');
        const html = res.data;
        
        // simple regex for p tags
        const pRegex = /<p[^>]*>(.*?)<\/p>/g;
        let match;
        const paragraphs = [];
        while ((match = pRegex.exec(html)) !== null) {
            // strip inner HTML tags from the paragraph content
            const cleanText = match[1].replace(/<[^>]+>/g, '').trim();
            if (cleanText.length > 20) {
                paragraphs.push(cleanText);
            }
        }
        
        console.log('Found paragraphs:', paragraphs.length);
        console.log(paragraphs.slice(0, 3));
    } catch (e) {
        console.error(e.message);
    }
}

test();
