package com.wolfpackunity.gym.email;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class EmailService {

    private final JavaMailSender mailer;

    public EmailService(JavaMailSender mailer) { this.mailer = mailer; }

    @Async
    public void sendBookingConfirmation(String to, String name, LocalDate date, int hour, int spot) {
        send(to, "Wolfpack Unity — Booking Confirmed",
                "Hi " + name + ",\n\nYour spot is booked!\n\n" +
                "Date: " + date + "\nTime: " + String.format("%02d:00", hour) +
                "\nSpot: #" + spot + "\n\nSee you at Wolfpack Unity!");
    }

    @Async
    public void sendCancellationNotice(String to, String name, LocalDate date, int hour, int spot) {
        send(to, "Wolfpack Unity — Booking Cancelled",
                "Hi " + name + ",\n\nYour booking has been cancelled.\n\n" +
                "Date: " + date + "\nTime: " + String.format("%02d:00", hour) +
                "\nSpot: #" + spot + "\n\nWolfpack Unity Team");
    }

    private void send(String to, String subject, String text) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(text);
        mailer.send(msg);
    }
}
