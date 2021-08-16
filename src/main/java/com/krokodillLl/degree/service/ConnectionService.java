package com.krokodillLl.degree.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.krokodillLl.degree.dto.ChatMessage;
import com.krokodillLl.degree.dto.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.*;

@Service
public class ConnectionService {

    private final Map<String, String> map;

    private final List<ActiveUsersListener> listeners;

    private final ThreadPoolExecutor notifyPool;

    private final ObjectMapper objectMapper;

    @Autowired
    private ChatService chatService;

    public ConnectionService() {
        this.map = new ConcurrentHashMap<>();
        this.listeners = new CopyOnWriteArrayList<>();
        this.notifyPool = new ThreadPoolExecutor(1, 5, 10, TimeUnit.SECONDS, new ArrayBlockingQueue<>(100));
        this.objectMapper = new ObjectMapper();
    }

    public ResponseEntity<String> connectUser(HttpServletRequest request, String username) {
        String remoteAddr = "";
        if (request != null) {
            remoteAddr = request.getHeader("Remote_Addr");
            if (remoteAddr == null || remoteAddr.isEmpty()) {
                remoteAddr = request.getHeader("X-FORWARDED-FOR");
                if (remoteAddr == null || remoteAddr.isEmpty()) {
                    remoteAddr = request.getRemoteAddr();
                }
            }
        }
        map.put(username, remoteAddr);
        notifyListeners();

        return new ResponseEntity<String>("{\"result\":\"success\"}", HttpStatus.OK);
    }

    public ResponseEntity<String> disconnectUser(String username) {
        map.remove(username);
        notifyListeners();
        return new ResponseEntity<String>("{\"result\":\"success\"}", HttpStatus.OK);
    }

    public void disconnectUser(SessionDisconnectEvent event) {
        String user = ((User) Objects.requireNonNull(StompHeaderAccessor.wrap(event.getMessage()).getHeader("simpUser"))).getName();
        disconnectUser(user);
        try {
            chatService.sendToBroadcast(objectMapper.writeValueAsString(new ChatMessage("server", user + " вышел", "ALL")));
        } catch (JsonProcessingException e) {
            System.out.println(e.getMessage());
        }
    }

    public Set<String> getUsers() {
        return map.keySet();
    }

    public void registerListener(ActiveUsersListener listener) {
        listeners.add(listener);
    }

    public void removeListener(ActiveUsersListener listener) {
        listeners.remove(listener);
    }

    private void notifyListeners() {
        notifyPool.submit(() -> listeners.forEach(ActiveUsersListener::notifyUsers));
    }
}
