import numpy as np
from PIL import Image
from ultralytics import YOLO
from constants import YOLO_DETECTION_WEIGHTS


class ReceiptDetection:
    def __init__(self):
        self.model = YOLO(YOLO_DETECTION_WEIGHTS)

    def crop_image(self, image, x, y, w, h):
        x = int(x)
        y = int(y)
        w = int(w)
        h = int(h)
        cropped_image = image[y: y + h, x: x + w]
        return cropped_image

    def predict(self, img):
        cropped_image_dict = {}
        results = self.model.predict(img, conf=0.55)
        img = np.asarray(img)  # converting to cv2 img
        boxes = results[0].boxes

        for i in range(len(boxes.xyxy)):
            points = boxes.xyxy[i]
            cropped_image = self.crop_image(
                img, points[0], points[1], points[2] - points[0], points[3] - points[1]
            )
            value = Image.fromarray(cropped_image)
            key = f"image_{i}"
            cropped_image_dict[key] = value
        return cropped_image_dict

