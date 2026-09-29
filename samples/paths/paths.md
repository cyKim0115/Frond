# 경로 픽스처

Phase 1-3 렌더 파이프라인용. 문서 폴더 기준 상대 경로에 한글·공백·`[`·`#`가 있어도 이미지가 깨지지 않아야 한다 (brief G14). 네 이미지는 64×64 단색: 빨강·초록·파랑·주황.

## 퍼센트 인코딩 (표준)

![한글](한글%20폴더/한글%20그림.png)
![공백](space%20dir/with%20space.png)
![대괄호](brackets/%5Bimg%5D.png)
![해시](hash/%23tag.png)

## 꺾쇠 (CommonMark, 공백 허용)

![한글](<한글 폴더/한글 그림.png>)
![공백](<space dir/with space.png>)
![대괄호](<brackets/[img].png>)
![해시](<hash/#tag.png>)

## 인코딩 없이

![대괄호 raw](brackets/[img].png)
![해시 raw](hash/#tag.png)
![한글 raw](한글 폴더/한글 그림.png)

마지막 줄은 공백 때문에 CommonMark상 이미지가 아니다(GitHub은 글자 그대로 보임). Typora는 관용적으로 열어 준다 — 어느 쪽을 따를지 Phase 1-3에서 결정하고 여기에 적는다.
