import { useState, useCallback, useRef } from "react";
import { CallMessage } from "../types";

interface CallMetricsData {
  startTime: Date;
  responseStartTime: Date | null;
  totalWords: number;
  totalCharacters: number;
  responseTimes: number[];
  sentimentScores: number[];
  messageCount: number;
}

export const useCallMetrics = () => {
  const [metrics, setMetrics] = useState<CallMetricsData>({
    startTime: new Date(),
    responseStartTime: null,
    totalWords: 0,
    totalCharacters: 0,
    responseTimes: [],
    sentimentScores: [],
    messageCount: 0,
  });

  const lastMessageTime = useRef<Date>(new Date());

  const recordMessage = useCallback((message: CallMessage) => {
    const now = new Date();
    const words = message.content.split(/\s+/).length;
    const characters = message.content.length;

    setMetrics((prev) => {
      const newResponseTimes = [...prev.responseTimes];
      const newSentimentScores = [...prev.sentimentScores];

      // Record response time for AI messages
      if (message.sender === "ai" && prev.responseStartTime) {
        const responseTime = now.getTime() - prev.responseStartTime.getTime();
        newResponseTimes.push(responseTime);
      }

      // Convert sentiment to numerical score
      const sentimentScore =
        message.sentiment === "positive"
          ? 1
          : message.sentiment === "negative"
            ? -1
            : 0;

      newSentimentScores.push(sentimentScore * message.confidence);

      return {
        ...prev,
        totalWords: prev.totalWords + words,
        totalCharacters: prev.totalCharacters + characters,
        responseTimes: newResponseTimes,
        sentimentScores: newSentimentScores,
        messageCount: prev.messageCount + 1,
        responseStartTime: message.sender === "user" ? now : null,
      };
    });

    lastMessageTime.current = now;
  }, []);

  const getAverageResponseTime = useCallback(() => {
    if (metrics.responseTimes.length === 0) return 0;
    return (
      metrics.responseTimes.reduce((sum, time) => sum + time, 0) /
      metrics.responseTimes.length
    );
  }, [metrics.responseTimes]);

  const getWordsPerMinute = useCallback(() => {
    const now = new Date();
    const durationMinutes =
      (now.getTime() - metrics.startTime.getTime()) / (1000 * 60);
    return durationMinutes > 0 ? metrics.totalWords / durationMinutes : 0;
  }, [metrics.startTime, metrics.totalWords]);

  const getAverageSentiment = useCallback(() => {
    if (metrics.sentimentScores.length === 0) return 0;
    return (
      metrics.sentimentScores.reduce((sum, score) => sum + score, 0) /
      metrics.sentimentScores.length
    );
  }, [metrics.sentimentScores]);

  const resetMetrics = useCallback(() => {
    setMetrics({
      startTime: new Date(),
      responseStartTime: null,
      totalWords: 0,
      totalCharacters: 0,
      responseTimes: [],
      sentimentScores: [],
      messageCount: 0,
    });
    lastMessageTime.current = new Date();
  }, []);

  const getCallDuration = useCallback(() => {
    const now = new Date();
    return Math.floor((now.getTime() - metrics.startTime.getTime()) / 1000);
  }, [metrics.startTime]);

  return {
    recordMessage,
    getAverageResponseTime,
    getWordsPerMinute,
    getAverageSentiment,
    getCallDuration,
    resetMetrics,
    metrics,
  };
};
