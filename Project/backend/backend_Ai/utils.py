from PIL import Image
import numpy as np
import io

def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
    img_array = np.array(img) / 255.0
    return np.expand_dims(img_array, axis=0)

def get_embedding(model, image_bytes):
    img_tensor = preprocess_image(image_bytes)
    embedding = model.predict(img_tensor)
    return embedding[0]
