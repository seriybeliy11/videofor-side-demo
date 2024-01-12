from flask import Flask, request, jsonify, send_file
import cv2
from ultralytics import YOLO
import numpy as np
from io import BytesIO
import base64
import zipfile
import os

from flask_cors import CORS

app = Flask(__name__)
CORS(app)

model = YOLO("best.pt")

@app.route('/upload', methods=['POST'])
def upload_files():
    try:
        files = request.files.getlist('file')
        if not files:
            return jsonify({'error': 'No files provided'}), 400

        results = []
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'a', zipfile.ZIP_DEFLATED, False) as zip_file:
            for file in files:
                if file.filename == '':
                    return jsonify({'error': 'No file selected'}), 400

                image = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)
                detections = model(image)[0]

                inference_time = detections.speed['inference']

                # Processed image with bounding boxes
                for data in detections.boxes.data.tolist():
                    confidence = data[4]
                    class_id = int(data[5])
                    xmin, ymin, xmax, ymax = map(int, data[:4])
                    cv2.rectangle(image, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2)
                    cv2.putText(image, f"{model.names[class_id]}: {confidence:.2f}", (xmin, ymin - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                # Save processed image to zip file
                _, img_encoded = cv2.imencode('.jpg', image)
                img_base64 = base64.b64encode(img_encoded).decode('utf-8')
                zip_file.writestr(file.filename, img_encoded.tobytes())

                # Formulate a string with results
                result_str = f"{file.filename} {image.shape[0]}x{image.shape[1]} {inference_time:.1f}ms"
                results.append({'result': result_str, 'image_base64': img_base64})

        zip_buffer.seek(0)
        return send_file(zip_buffer, download_name='images.zip', as_attachment=True)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
