package com.krokodillLl.degree.service;

import com.krokodillLl.degree.dto.ChatMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.util.Set;

@Service
public class ChatService implements ActiveUsersListener {

    @PostConstruct
    private void init() {
        connectionService.registerListener(this);
    }

    @PreDestroy
    private void destroy() {
        connectionService.removeListener(this);
    }

    @Autowired
    private SimpMessagingTemplate webSocket;

    @Autowired
    private ConnectionService connectionService;


    public ChatMessage sendToAll(ChatMessage chatMessage) {
        return new ChatMessage(chatMessage.getFrom(), chatMessage.getText(), "ALL");
    }

    public void sendToUser(ChatMessage chatMessage, String url) {
        String sender = chatMessage.getFrom();
        ChatMessage message = new ChatMessage(chatMessage.getFrom(), chatMessage.getText(), chatMessage.getRecipient());
        if (!sender.equals(chatMessage.getRecipient())) {
            webSocket.convertAndSendToUser(sender, url, message);
        }

        webSocket.convertAndSendToUser(chatMessage.getRecipient(), url, message);
    }

    @Override
    public void notifyUsers() {
        Set<String> activeUsers = connectionService.getUsers();
        webSocket.convertAndSend("/topic/active", activeUsers);
    }

    public void sendToBroadcast(String message) {
        webSocket.convertAndSend("/topic/broadcast", message);
    }
}
