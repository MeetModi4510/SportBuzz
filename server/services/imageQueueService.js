import axios from 'axios';
import NodeCache from 'node-cache';

const imageCache = new NodeCache({ stdTTL: 86400, maxKeys: 2000 });

class ImageQueueService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.delayMs = 3000;
    this.pendingRequests = new Map();
  }

  async getImage(id) {
    if (imageCache.has(id)) {
      return imageCache.get(id);
    }
    
    if (this.pendingRequests.has(id)) {
      return this.pendingRequests.get(id);
    }

    const promise = new Promise((resolve, reject) => {
      this.queue.push({ id, resolve, reject });
      if (!this.isProcessing) {
        this.processQueue().catch(err => console.error('[ImageQueue] Error:', err));
      }
    });

    this.pendingRequests.set(id, promise);
    try {
      const buffer = await promise;
      return buffer;
    } finally {
      this.pendingRequests.delete(id);
    }
  }

  cancelRequest(id) {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      console.log(`[ImageQueue] Cancelling queued request for ID ${id}`);
      const [{ reject }] = this.queue.splice(index, 1);
      reject(new Error('Request cancelled by client'));
      this.pendingRequests.delete(id);
    }
  }

  async processQueue() {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { id, resolve, reject } = this.queue.shift();

      if (imageCache.has(id)) {
        resolve(imageCache.get(id));
        continue;
      }

      try {
        console.log(`[ImageQueue] Fetching image for ID ${id}...`);
        const photoUrl = `https://images.fotmob.com/image_resources/playerimages/${id}.png`;
        const response = await axios({
          url: photoUrl,
          method: 'GET',
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.fotmob.com/'
          }
        });

        const buffer = Buffer.from(response.data, 'binary');
        imageCache.set(id, buffer);
        resolve(buffer);
        console.log(`[ImageQueue] Cached image for ID ${id}`);
      } catch (error) {
        console.error(`[ImageQueue] Failed to fetch image ${id}:`, error.message);
        reject(error);
      }

      if (this.queue.length > 0) {
        await new Promise(res => setTimeout(res, this.delayMs));
      }
    }

    this.isProcessing = false;
  }
}

export const imageQueueService = new ImageQueueService();
