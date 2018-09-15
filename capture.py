import cv2
import time
import requests
import json
import base64

cam = cv2.VideoCapture(0)
cv2.namedWindow("test")
img_counter = 0
while True:
    ret, frame = cam.read()
    cv2.imshow("test", frame)
    if not ret:
        break
    img_name = "pic.jpg".format(img_counter)
    cv2.imwrite(img_name, frame)
    print("Written!".format(img_name))
    img_counter += 1
    addr = 'http://10.194.85.115:3000'
    test_url = addr + '/upload?q=question&shelter=JHack'
    # prepare headers for http request
    content_type = 'image/jpeg'
    headers = {'content-type': content_type}

    img = cv2.imread(img_name)
    # encode image as jpeg
    _, img_encoded = cv2.imencode('.jpg', img)
    img_encoded = base64.b64encode(img_encoded)
    # send http request with image and receive response
    response = requests.post(test_url, data=img_encoded, headers=headers)
    # decode response
cam.release()
cv2.destroyAllWindows()
