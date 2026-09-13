package com.ryval.backend.repository;

import com.ryval.backend.model.GhostAnswer;
import com.ryval.backend.model.GhostSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GhostAnswerRepository extends JpaRepository<GhostAnswer, Long> {
    List<GhostAnswer> findByGhostSession(GhostSession ghostSession);
}