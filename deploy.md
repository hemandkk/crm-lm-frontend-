
# Deploy to AWS (ECR + ECS Fargate + ALB — recommended)

1. Build & push image (run where Docker is available, e.g., your machine):


aws ecr create-repository --repository-name crm-frontend
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGION=ap-south-1
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT.dkr.ecr.$REGION.amazonaws.com
docker build -t crm-frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1 \
  --build-arg NEXT_PUBLIC_APP_BASE_URL=https://api.yourdomain.com .
docker tag crm-frontend:latest $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/crm-frontend:latest
docker push $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/crm-frontend:latest

3. DNS/SSL: Route 53 A-record (alias) → ALB, ACM certificate for your domain.

4. Updating: rebuild with new --build-arg values, push a new tag, then aws ecs update-service --cluster crm --service web --force-new-deployment.

Two caveats:

NEXT_PUBLIC_* are baked at build time, so a different environment (staging vs prod) needs a separate image build.
Your FastAPI backend runs as its own container/task; only NEXT_PUBLIC_API_URL must point at it from outside (public or private ALB).
For lower cost you can skip ECS and run the image on a single EC2/docker run, but Fargate removes server management. 