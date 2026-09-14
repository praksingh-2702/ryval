package com.ryval.backend.config;

import com.ryval.backend.model.Question;
import com.ryval.backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class QuestionSeeder implements CommandLineRunner {

    private final QuestionRepository questionRepository;

    @Override
    public void run(String... args) {
        // Only seed if empty, so this is safe to leave in permanently — it
        // won't duplicate questions on every restart/redeploy, but will
        // auto-populate a fresh/reset database (e.g. after Render's free
        // Postgres expires and you spin up a new instance).
        if (questionRepository.count() > 0) {
            return;
        }

        questionRepository.saveAll(List.of(
            q("What is the time complexity of binary search on a sorted array?",
              "O(n)", "O(log n)", "O(n log n)", "O(1)", "B", "DSA", Question.Difficulty.EASY),
            q("Which data structure uses LIFO order?",
              "Queue", "Stack", "Linked List", "Heap", "B", "DSA", Question.Difficulty.EASY),
            q("What is the worst-case time complexity of QuickSort?",
              "O(n log n)", "O(n)", "O(n^2)", "O(log n)", "C", "DSA", Question.Difficulty.MEDIUM),
            q("Which traversal of a binary tree visits nodes in sorted order for a BST?",
              "Preorder", "Postorder", "Inorder", "Level order", "C", "DSA", Question.Difficulty.MEDIUM),
            q("What data structure is typically used to implement a priority queue?",
              "Array", "Heap", "Stack", "Queue", "B", "DSA", Question.Difficulty.MEDIUM),

            q("Which OOP concept allows a subclass to provide a specific implementation of a method already defined in its superclass?",
              "Encapsulation", "Abstraction", "Overriding", "Overloading", "C", "OOP", Question.Difficulty.EASY),
            q("What is encapsulation in OOP?",
              "Hiding internal state and requiring interaction through methods",
              "Having multiple methods with the same name",
              "Inheriting behavior from a parent class",
              "Creating multiple objects from a class",
              "A", "OOP", Question.Difficulty.EASY),
            q("Which of these is NOT a pillar of OOP?",
              "Inheritance", "Polymorphism", "Compilation", "Abstraction",
              "C", "OOP", Question.Difficulty.EASY),
            q("What is method overloading?",
              "Same method name, different parameters, same class",
              "Same method signature in parent and child class",
              "A method calling itself",
              "A method with no return type",
              "A", "OOP", Question.Difficulty.MEDIUM),
            q("Which OOP principle restricts direct access to some of an object's components?",
              "Polymorphism", "Encapsulation", "Inheritance", "Abstraction",
              "B", "OOP", Question.Difficulty.EASY),

            q("Which normal form eliminates transitive dependency?",
              "1NF", "2NF", "3NF", "BCNF",
              "C", "DBMS", Question.Difficulty.MEDIUM),
            q("What does ACID stand for in database transactions?",
              "Atomicity, Consistency, Isolation, Durability",
              "Accuracy, Concurrency, Integrity, Durability",
              "Atomicity, Concurrency, Isolation, Data",
              "Accuracy, Consistency, Isolation, Data",
              "A", "DBMS", Question.Difficulty.EASY),
            q("Which SQL clause is used to filter groups after aggregation?",
              "WHERE", "HAVING", "GROUP BY", "ORDER BY",
              "B", "DBMS", Question.Difficulty.EASY),
            q("What type of join returns only matching rows from both tables?",
              "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL OUTER JOIN",
              "C", "DBMS", Question.Difficulty.EASY),
            q("What is a deadlock in the context of database transactions?",
              "A transaction that never commits due to an infinite loop",
              "Two or more transactions waiting on each other's locks indefinitely",
              "A transaction that violates a foreign key constraint",
              "A query that runs slower than expected",
              "B", "DBMS", Question.Difficulty.MEDIUM),

            q("Which scheduling algorithm can cause starvation?",
              "Round Robin", "First Come First Serve", "Priority Scheduling", "Shortest Job First",
              "C", "OS", Question.Difficulty.MEDIUM),
            q("What is a race condition?",
              "When two processes access shared data and the outcome depends on timing",
              "When a process runs out of memory",
              "When a CPU has too many cores",
              "When a disk read fails",
              "A", "OS", Question.Difficulty.MEDIUM),
            q("Which of these is NOT a valid process state?",
              "Running", "Waiting", "Terminated", "Compiling",
              "D", "OS", Question.Difficulty.EASY),
            q("What is thrashing in an operating system?",
              "Excessive CPU usage by a single process",
              "Excessive paging causing degraded performance",
              "A crash caused by a null pointer",
              "A deadlock between two threads",
              "B", "OS", Question.Difficulty.MEDIUM),
            q("Which memory management technique divides memory into fixed-size blocks?",
              "Segmentation", "Paging", "Swapping", "Caching",
              "B", "OS", Question.Difficulty.EASY),

            q("What layer of the OSI model is responsible for routing?",
              "Data Link", "Network", "Transport", "Session",
              "B", "CN", Question.Difficulty.EASY),
            q("Which protocol is connection-oriented?",
              "UDP", "IP", "TCP", "ICMP",
              "C", "CN", Question.Difficulty.EASY),
            q("What does DNS stand for?",
              "Domain Name System", "Data Network Service", "Digital Naming Standard", "Domain Network Server",
              "A", "CN", Question.Difficulty.EASY),
            q("Which port does HTTPS use by default?",
              "80", "443", "21", "22",
              "B", "CN", Question.Difficulty.EASY),
            q("What is the purpose of the three-way handshake in TCP?",
              "To encrypt data before transmission",
              "To establish a reliable connection between client and server",
              "To compress data for faster transfer",
              "To resolve a domain name to an IP address",
              "B", "CN", Question.Difficulty.MEDIUM)
        ));
    }

    private Question q(String prompt, String a, String b, String c, String d,
                        String correct, String category, Question.Difficulty difficulty) {
        return Question.builder()
                .prompt(prompt)
                .optionA(a)
                .optionB(b)
                .optionC(c)
                .optionD(d)
                .correctAnswer(correct)
                .category(category)
                .difficulty(difficulty)
                .build();
    }
}