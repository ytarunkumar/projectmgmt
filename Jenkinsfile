pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                // Checkout your source code from a Git repository
                checkout scm
            }
        }

        stage('Build') {
            steps {
                // Install Node.js and dependencies
                sh 'npm install --legacy-peer-deps'  // Or 'npm install --legacy-peer-deps'
            }
        }

        stage('Archive Artifacts') {
            steps {
                // Archive build artifacts (e.g., JAR, WAR, ZIP)
                archiveArtifacts artifacts: '**/target/*.jar', allowEmptyArchive: true
            }
        }

        stage('Deploy') {
            steps {
                // Replace this with your deployment commands
                // For example, deploying to a web server or cloud platform
                sh 'npm deploy'
            }
        }
    }

    post {
        success {
            // Define actions to take on successful build and deployment
            echo 'Build and deployment successful!'
            // You can add further actions like sending notifications or triggering other jobs here
        }
        failure {
            // Define actions to take on build or deployment failure
            echo 'Build or deployment failed!'
            // You can add further actions like sending notifications or triggering other jobs here
        }
    }
}
