package com.ryval.backend.config;

import com.ryval.backend.dto.request.UpdateAvatarRequest;
import com.ryval.backend.dto.response.AvatarResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Pattern;

/**
 * Bank of the sigil parts a player can choose from, the same idea as the
 * question bank in QuestionSeeder. The keys MUST match
 * ryval-frontend/src/components/avatar/parts.jsx.
 *
 * The database stores keys (never indexes), so parts can be reordered or
 * added without migrating any rows.
 */
@Component
public class AvatarCatalog {

    public static final List<String> SHAPES =
            List.of("round", "hex", "shield", "diamond", "wedge", "capsule", "block", "crown");
    public static final List<String> EYES =
            List.of("dot", "slit", "fierce", "wide", "visor", "chevron", "cross", "cyclops");
    public static final List<String> MARKS =
            List.of("smile", "fangs", "scar", "warpaint", "dots", "plus", "grille", "gem");

    // Also used as the column defaults on the User entity.
    public static final String DEFAULT_SHAPE = "round";
    public static final String DEFAULT_EYES = "dot";
    public static final String DEFAULT_MARK = "smile";
    public static final String DEFAULT_COLOR = "#2D4BFF";

    private static final Pattern HEX_COLOR = Pattern.compile("^#[0-9A-Fa-f]{6}$");

    // Starter colors for brand-new accounts. Players can pick any color later.
    private static final List<String> STARTER_COLORS = List.of(
            "#2D4BFF", "#FFC21A", "#2EC4B6", "#FF4D6D", "#8AC926",
            "#9B5DE5", "#FF8A1F", "#00BBF9", "#F15BB5", "#1FB36B"
    );

    /** A random starter sigil, assigned at registration so nobody is ever blank. */
    public AvatarResponse randomStarter() {
        ThreadLocalRandom random = ThreadLocalRandom.current();
        return AvatarResponse.builder()
                .shape(SHAPES.get(random.nextInt(SHAPES.size())))
                .eyes(EYES.get(random.nextInt(EYES.size())))
                .mark(MARKS.get(random.nextInt(MARKS.size())))
                .color(STARTER_COLORS.get(random.nextInt(STARTER_COLORS.size())))
                .build();
    }

    /**
     * Checks every field against the catalog. Throws IllegalArgumentException,
     * which GlobalExceptionHandler turns into a 400 with {"error": "..."}.
     */
    public void validate(UpdateAvatarRequest request) {
        requireOneOf("head", request.getShape(), SHAPES);
        requireOneOf("eyes", request.getEyes(), EYES);
        requireOneOf("mark", request.getMark(), MARKS);
        if (request.getColor() == null || !HEX_COLOR.matcher(request.getColor()).matches()) {
            throw new IllegalArgumentException("Avatar color must be a hex value like #2D4BFF");
        }
    }

    private void requireOneOf(String field, String value, List<String> allowed) {
        // List.of(...).contains(null) throws, so null is checked first.
        if (value == null || !allowed.contains(value)) {
            throw new IllegalArgumentException("Unknown avatar " + field);
        }
    }
}