package com.ryval.backend.repository;

import com.ryval.backend.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByDifficulty(Question.Difficulty difficulty);
    List<Question> findByCategory(String category);
}