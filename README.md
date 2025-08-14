# 네팔어 단어장

## 개요

- 프로그램 개발 요청이 정말 많았습니다.
- 2019년 쯤 첫 개발한 네팔어 단어장 앱 버전이 오래되어 유지보수의 어려움이 있었습니다.
- 웹으로 개발하여 개발 편의성을 증가하기로 했습니다.

## 화면 설계

- 메인 화면

  - 단어만 검색할 수 있는 Search Box
  - 네팔어, 한국어, 영어 등 모든 언어로 네팔어 단어, 한국어 뜻 검색 가능
  - 검색하는 단어로 실시간 업데이트 되는 리스트 구현
  - Search Box 위치는 맨 하단에 fix, 실시간 업데이트 리스트는 메인 화면 전체로 구성
  - 메인 화면 오른쪽 상단에 관리자 로그인 버튼 보이지 않게 활성
  - 단어 검색은 관리자 권한 없어도 가능
  - 단어 수정/추가/삭제는 관리자 권한만 가능

- 단어 상세 화면

  - 메인 화면에서 단어를 누르면, 상세 페이지로 이동
  - 상세 페이지에는 네팔어 단어와 한국어 뜻, 예문이 제공된다.
  - 관리자의 경우 수정/삭제 할 수 있도록 활성화한다.

- 로그인 화면
  - 메인 화면은 로그인 없이도 접속 가능
  - 관리자 계정정보(ID/PW)는 firebase에서 가져온다.
  - 관리자로 로그인 해야 단어 상세 정보에서 편집(수정/삭제) 가능.
  - 관리자로 로그인 해야 신규 단어 추가 가능.

## 데이터베이스 설계

- firebase dataStore를 사용한다.

  - 연결 정보는 .env.local을 사용

- 단어 database

  - document name : [Words]
    - features
      - [Nepali] : String
      - [Sound] : String
      - [Korean] : String
      - [Example] : String
      - [DeleteFlag] : String
      - [CreatedDate] : DateTime
      - [UpdateDate] : DateTime

- 사용자 admin database
  - document name : [Users]
    - features
      - [UserId] : String
      - [UserName] : String
      - [PassWord] : String
      - [CreatedDate] : DateTime
      - [LastestDate] : DateTime
