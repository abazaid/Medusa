export default function medusaError(error: any): never {
  if (error.response) {
    const u = new URL(error.config.url, error.config.baseURL)
    console.error("Resource:", u.toString())
    console.error("Response data:", error.response.data)
    console.error("Status code:", error.response.status)

    const message = error.response.data.message || error.response.data
    throw new Error(message.charAt(0).toUpperCase() + message.slice(1) + ".")
  } else if (error.request) {
    throw new Error("تعذر الوصول إلى الخادم. يرجى المحاولة مرة أخرى لاحقًا.")
  } else {
    const errorMessage = error.message || error.code || JSON.stringify(error) || "Unknown error"
    console.error("Medusa Error:", error)
    throw new Error("حدث خطأ: " + errorMessage)
  }
}
