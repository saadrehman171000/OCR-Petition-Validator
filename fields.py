import cv2
from PIL import Image
from ultralytics import YOLO
from constants import YOLO_WEIGHTS

class ReceiptFields:
    def __init__(self):
        self.model = YOLO(YOLO_WEIGHTS)

    def crop_image(self, image, x, y, w, h):
        x = int(x)
        y = int(y)
        w = int(w)
        h = int(h)
        cropped_image = image[y : y + h, x : x + w]
        return cropped_image

    def predict(self, img, conf=0.30):
        cropped_image_dict = {}
        results = self.model.predict(img, conf=0.30)
        img = cv2.cvtColor(cv2.imread(img), cv2.COLOR_BGR2RGB)
        boxes = results[0].boxes
        classes = list(results[0].boxes.cls)

        for i in range(len(boxes.xyxy)):
            points = boxes.xyxy[i]
            cropped_image = self.crop_image(
                img, points[0], points[1], points[2] - points[0], points[3] - points[1]
            )
            value = Image.fromarray(cropped_image)
            key = f"class_{classes[i]}"
            cropped_image_dict[key] = value
        return cropped_image_dict

    def predict_with_pad(self, img, padding=0):
        cropped_image_dict = {}

        results = self.model.predict(img, conf=0.30)
        img = cv2.cvtColor(cv2.imread(img), cv2.COLOR_BGR2RGB)

        boxes = results[0].boxes
        classes = list(results[0].boxes.cls)

        for i in range(len(boxes.xyxy)):
            points = boxes.xyxy[i]

            # Adding padding to bounding box coordinates
            x1 = max(0, points[0] - padding)
            y1 = max(0, points[1] - padding)
            x2 = min(img.shape[1], points[2] + padding)
            y2 = min(img.shape[0], points[3] + padding)

            cropped_image = self.crop_image(img, x1, y1, x2 - x1, y2 - y1)
            value = Image.fromarray(cropped_image)
            key = f"class_{classes[i]}"
            cropped_image_dict[key] = value
        return cropped_image_dict
