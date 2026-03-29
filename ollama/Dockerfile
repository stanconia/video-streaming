FROM ollama/ollama:latest

# Pre-pull the model into the image so it's available immediately on container start
# This avoids slow model downloads on every ECS task launch
RUN ollama serve & \
    SERVER_PID=$! && \
    sleep 10 && \
    ollama pull llama3.1:8b-instruct-q4_0 && \
    kill $SERVER_PID

EXPOSE 11434

ENTRYPOINT ["/bin/ollama"]
CMD ["serve"]
