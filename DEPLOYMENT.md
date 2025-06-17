# TruthCast Deployment Guide

## Overview
TruthCast is a real-time AI fact-checking assistant specifically designed for podcasters. This guide covers deploying the multi-modal voice and text fact-checking system to production.

## Application Architecture
TruthCast consists of:
- Multi-modal processing engine
- Real-time WebSocket server
- Voice command processing
- 3-source verification system
- Mobile companion app

## Environment Variables
Set the following environment variables for TruthCast:

### Core Application
- `FRONTEND_URL`: https://truthcast.vercel.app
- `ALLOWED_ORIGINS`: https://truthcast.vercel.app,https://app.truthcast.com
- `FROM_EMAIL`: noreply@truthcast.com
- `S3_BUCKET_NAME`: truthcast-storage-production
