package com.krokodillLl.degree.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.Set;

public class Utils {

    private static final String TIME_FORMATTER = "HH:mm:ss";
    private static final Set<String> STICKERS = new LinkedHashSet<>();

    static {
        STICKERS.add("library/stickers/Ptichka_Milaya_Oret_Png.png");
        STICKERS.add("library/stickers/Ptichka_Milaya_S_Busikami_Png.png");
        STICKERS.add("library/stickers/Samovlyublennaya_Ovechka.png");
        STICKERS.add("library/stickers/Kamen.png");
    }

    public static String getCurrentTimeStamp() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(TIME_FORMATTER);
        return LocalDateTime.now().format(formatter);
    }
    public static Set<String> getStickers() {
        return STICKERS;
    }
}
