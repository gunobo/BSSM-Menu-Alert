# 기본 시간표 관리 API

관리자가 설정한 기본 시간표를 저장·조회하는 백엔드 구현 가이드입니다.  
프론트엔드는 이 데이터를 NEIS 시간표와 비교해 변경된 칸을 노란색으로 표시합니다.

---

## 엔드포인트 목록

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| `GET` | `/admin/timetable?grade=1&class=1` | ADMIN, MODERATOR | 기본 시간표 조회 |
| `POST` | `/admin/timetable` | ADMIN, MODERATOR | 기본 시간표 저장/수정 |
| `GET` | `/timetable/base?grade=1&class=1` | 인증 불필요 (공개) | 학생용 기본 시간표 조회 |

---

## 데이터 구조

### subjects 2차원 배열

```
subjects[교시 인덱스 (0=1교시 ~ 6=7교시)][요일 인덱스 (0=월 ~ 4=금)]
```

예시:
```json
{
  "grade": 1,
  "classNum": 2,
  "subjects": [
    ["수학", "영어", "국어", "과학", "체육"],
    ["정보", "수학", "영어", "체육", "음악"],
    ["국어", "과학", "정보", "수학", "영어"],
    ["체육", "국어", "수학", "음악", "과학"],
    ["음악", "정보", "체육", "영어", "국어"],
    ["영어", "체육", "과학", "정보", "수학"],
    ["과학", "음악", "음악", "국어", "정보"]
  ]
}
```

---

## Spring Boot 구현 코드

### 1. Entity

```java
// src/main/java/com/bssm/entity/BaseTimetable.java

package com.bssm.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "base_timetable",
    uniqueConstraints = @UniqueConstraint(columnNames = {"grade", "class_num"})
)
@Getter @Setter @NoArgsConstructor
public class BaseTimetable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int grade;

    @Column(name = "class_num", nullable = false)
    private int classNum;

    /** subjects 2차원 배열을 JSON 문자열로 직렬화해 저장 */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String subjectsJson;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /** 마지막으로 수정한 관리자 이메일 */
    private String updatedBy;
}
```

---

### 2. DTO

```java
// src/main/java/com/bssm/dto/BaseTimetableDto.java

package com.bssm.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class BaseTimetableDto {
    private int grade;
    private int classNum;

    /**
     * subjects[periodIdx][dayIdx]
     * periodIdx: 0~6 (1~7교시)
     * dayIdx:    0~4 (월~금)
     */
    private List<List<String>> subjects;
}
```

---

### 3. Repository

```java
// src/main/java/com/bssm/repository/BaseTimetableRepository.java

package com.bssm.repository;

import com.bssm.entity.BaseTimetable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BaseTimetableRepository extends JpaRepository<BaseTimetable, Long> {
    Optional<BaseTimetable> findByGradeAndClassNum(int grade, int classNum);
}
```

---

### 4. Service

```java
// src/main/java/com/bssm/service/TimetableService.java

package com.bssm.service;

import com.bssm.dto.BaseTimetableDto;
import com.bssm.entity.BaseTimetable;
import com.bssm.repository.BaseTimetableRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TimetableService {

    private final BaseTimetableRepository repository;
    private final ObjectMapper objectMapper;

    /** 기본 시간표 조회. 없으면 null 반환 */
    public BaseTimetableDto getBaseTimetable(int grade, int classNum) {
        return repository.findByGradeAndClassNum(grade, classNum)
            .map(entity -> {
                try {
                    List<List<String>> subjects = objectMapper.readValue(
                        entity.getSubjectsJson(),
                        new TypeReference<>() {}
                    );
                    return new BaseTimetableDto(grade, classNum, subjects);
                } catch (Exception e) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "시간표 데이터 파싱 실패");
                }
            })
            .orElse(null);
    }

    /** 기본 시간표 저장 (없으면 생성, 있으면 덮어쓰기) */
    public void saveBaseTimetable(BaseTimetableDto dto, String adminEmail) {
        if (dto.getGrade() < 1 || dto.getGrade() > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "학년은 1~3이어야 합니다.");
        }
        if (dto.getClassNum() < 1 || dto.getClassNum() > 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "반은 1~4이어야 합니다.");
        }
        if (dto.getSubjects() == null || dto.getSubjects().size() != 7) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "subjects는 7교시 배열이어야 합니다.");
        }

        BaseTimetable entity = repository
            .findByGradeAndClassNum(dto.getGrade(), dto.getClassNum())
            .orElse(new BaseTimetable());

        try {
            entity.setGrade(dto.getGrade());
            entity.setClassNum(dto.getClassNum());
            entity.setSubjectsJson(objectMapper.writeValueAsString(dto.getSubjects()));
            entity.setUpdatedAt(LocalDateTime.now());
            entity.setUpdatedBy(adminEmail);
            repository.save(entity);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "시간표 저장 실패");
        }
    }
}
```

---

### 5. 관리자 컨트롤러 (인증 필요)

```java
// src/main/java/com/bssm/controller/AdminTimetableController.java

package com.bssm.controller;

import com.bssm.dto.BaseTimetableDto;
import com.bssm.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/timetable")
@RequiredArgsConstructor
public class AdminTimetableController {

    private final TimetableService timetableService;

    /**
     * GET /admin/timetable?grade=1&class=1
     * 관리자·운영자가 설정한 기본 시간표 조회
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<BaseTimetableDto> getBaseTimetable(
        @RequestParam int grade,
        @RequestParam("class") int classNum
    ) {
        BaseTimetableDto dto = timetableService.getBaseTimetable(grade, classNum);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    /**
     * POST /admin/timetable
     * 기본 시간표 저장 (없으면 생성, 있으면 덮어쓰기)
     *
     * Request Body:
     * {
     *   "grade": 1,
     *   "classNum": 2,
     *   "subjects": [["수학","영어",...], ...]
     * }
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Void> saveBaseTimetable(
        @RequestBody BaseTimetableDto dto,
        Authentication auth
    ) {
        timetableService.saveBaseTimetable(dto, auth.getName());
        return ResponseEntity.ok().build();
    }
}
```

---

### 6. 공개 컨트롤러 (인증 불필요 — 학생용)

```java
// src/main/java/com/bssm/controller/TimetableController.java

package com.bssm.controller;

import com.bssm.dto.BaseTimetableDto;
import com.bssm.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/timetable")
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableService timetableService;

    /**
     * GET /timetable/base?grade=1&class=1
     * 학생 페이지에서 노란색 표시 비교용으로 사용하는 공개 엔드포인트
     */
    @GetMapping("/base")
    public ResponseEntity<BaseTimetableDto> getBaseTimetable(
        @RequestParam int grade,
        @RequestParam("class") int classNum
    ) {
        BaseTimetableDto dto = timetableService.getBaseTimetable(grade, classNum);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }
}
```

---

### 7. Security 설정에 공개 경로 추가

기존 `SecurityConfig.java`의 `permitAll()` 목록에 `/timetable/base`를 추가해야 합니다.

```java
// SecurityConfig.java (기존 파일에 추가)

http.authorizeHttpRequests(auth -> auth
    // ... 기존 허용 경로들 ...
    .requestMatchers("/timetable/base").permitAll()   // 학생용 기본 시간표 조회 (공개)
    .requestMatchers("/admin/**").hasAnyRole("ADMIN", "MODERATOR")
    // ...
);
```

---

### 8. DB 마이그레이션 (DDL)

```sql
CREATE TABLE base_timetable (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    grade       INT             NOT NULL,
    class_num   INT             NOT NULL,
    subjects_json TEXT          NOT NULL,
    updated_at  DATETIME        NOT NULL,
    updated_by  VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uq_grade_class (grade, class_num)
);
```

---

## 요청/응답 예시

### 기본 시간표 저장
```
POST /admin/timetable
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "grade": 1,
  "classNum": 2,
  "subjects": [
    ["수학", "영어", "국어", "과학", "체육"],
    ["정보", "수학", "영어", "체육", "음악"],
    ["국어", "과학", "정보", "수학", "영어"],
    ["체육", "국어", "수학", "음악", "과학"],
    ["음악", "정보", "체육", "영어", "국어"],
    ["영어", "체육", "과학", "정보", "수학"],
    ["과학", "음악", "음악", "국어", "정보"]
  ]
}

→ 200 OK
```

### 기본 시간표 조회 (관리자)
```
GET /admin/timetable?grade=1&class=2
Authorization: Bearer <accessToken>

→ 200 OK
{
  "grade": 1,
  "classNum": 2,
  "subjects": [ ... ]
}
```

### 기본 시간표 조회 (학생, 공개)
```
GET /timetable/base?grade=1&class=2

→ 200 OK
{
  "grade": 1,
  "classNum": 2,
  "subjects": [ ... ]
}

→ 404 Not Found  (관리자가 아직 설정하지 않은 경우)
```
