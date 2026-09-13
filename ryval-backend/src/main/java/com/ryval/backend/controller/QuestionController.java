package com.ryval.backend.controller;

import com.ryval.backend.model.Question;
import com.ryval.backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionRepository questionRepository;

    @GetMapping
    public ResponseEntity<List<Question>> getAll() {
        return ResponseEntity.ok(questionRepository.findAll());
    }

    @GetMapping("/difficulty/{difficulty}")
    public ResponseEntity<List<Question>> getByDifficulty(@PathVariable Question.Difficulty difficulty) {
        return ResponseEntity.ok(questionRepository.findByDifficulty(difficulty));
    }

    @PostMapping
    public ResponseEntity<Question> create(@RequestBody Question question) {
        return ResponseEntity.ok(questionRepository.save(question));
    }
}