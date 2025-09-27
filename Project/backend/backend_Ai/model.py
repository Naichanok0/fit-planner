# backend_Ai/model.py
import tensorflow as tf

def create_model():
    model = tf.keras.applications.MobileNetV2(
        weights="imagenet",
        include_top=False,
        pooling="avg",
        input_shape=(224, 224, 3)
    )
    return model

base_model = create_model()
