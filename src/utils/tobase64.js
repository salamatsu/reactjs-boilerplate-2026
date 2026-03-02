// File to base64
export const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export const convertToBase64 = async (file) => {
  try {
    const result = await toBase64(file);
    return result;
  } catch (error) {
    alert("Image convertion failed. Please try again or contact support.");
    return;
  }
};

// URL to base64
export const imageToBase64 = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const base64 = canvas.toDataURL("image/png");
      resolve(base64);
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = imageUrl;
  });
};
