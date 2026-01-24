/**
 * Cloudinary utility functions for client-side image uploads
 */

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to upload image')
  }

  return data.url
}
