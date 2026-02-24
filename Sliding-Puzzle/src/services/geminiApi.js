const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`

const BREEDS = [
  'Golden Retriever', 'Labrador Retriever', 'French Bulldog', 'Poodle',
  'Beagle', 'German Shepherd', 'Corgi', 'Dachshund', 'Shiba Inu',
  'Husky', 'Pomeranian', 'Chihuahua', 'Border Collie', 'Dalmatian',
  'Maltese', 'Yorkshire Terrier', 'Cavalier King Charles Spaniel',
  'Bichon Frise', 'Cocker Spaniel', 'Samoyed', 'Bernese Mountain Dog',
  'Australian Shepherd', 'Akita', 'Shih Tzu', 'Pug', 'Rottweiler',
  'Doberman', 'Great Dane', 'Boxer', 'Shetland Sheepdog',
  'Miniature Schnauzer', 'Papillon', 'Chow Chow', 'Alaskan Malamute',
  'Jack Russell Terrier', 'English Bulldog', 'Vizsla', 'Weimaraner',
]

const SCENES = [
  'playing in a sunny garden',
  'sitting on a cozy blanket indoors',
  'running through autumn leaves in a park',
  'lying on green grass',
  'peeking out from behind a door',
  'wearing a tiny hat or bow tie',
  'playing with a ball',
  'sleeping peacefully on a soft pillow',
  'sitting in a flower field',
  'looking out a window on a rainy day',
  'splashing in a shallow puddle',
  'tilting its head curiously',
]

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildPrompt() {
  const breed = pickRandom(BREEDS)
  const scene = pickRandom(SCENES)
  return `Generate a high-quality, adorable photo of a ${breed} puppy ${scene}. The image should be square (1:1 aspect ratio), well-lit, vivid colors, and the puppy should be the main subject centered in the frame.`
}

const MAX_RETRIES = 3

export async function generateDogImage(retryCount = 0) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt() }] }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error?.message || `API request failed (${response.status})`
      )
    }

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts

    if (!parts) {
      throw new Error('No content in API response.')
    }

    const imagePart = parts.find((p) => p.inlineData)

    if (!imagePart) {
      throw new Error('No image in API response.')
    }

    const { mimeType, data: base64Data } = imagePart.inlineData
    return `data:${mimeType};base64,${base64Data}`
  } catch (error) {
    if (retryCount < MAX_RETRIES - 1) {
      const delay = 1000 * (retryCount + 1)
      await new Promise((r) => setTimeout(r, delay))
      return generateDogImage(retryCount + 1)
    }
    throw error
  }
}
