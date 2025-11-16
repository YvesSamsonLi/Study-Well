<template>
  <div class="about-page-bg">
    <div class="navbar-fixed">
      <NavbarComponent
        blur-amount="0px"
        box-shadow="none"
        bg-color="#00000000"
        borderColor="#00000000"
        min-height="100px"
        padding="12px 40px"
      >
        <template #left>
          <img src="/logo.png" alt="Logo" style="height: 40px" />
        </template>
        <template #right>
          <ElButton type="primary" class="login-button">
            <router-link to="/login" class="login-text">Sign In</router-link>
          </ElButton>
        </template>
      </NavbarComponent>
    </div>

    <div class="about-page-content">
      <div class="content-box">
        <!-- About Section -->
        <section class="about-section">
          <h1 class="main-title">About StudyWell</h1>
          <p class="description">
            StudyWell is a comprehensive platform designed specifically for NTU students to simplify
            the management of their academic and campus life. It streamlines access to essential
            school matters such as schedules, coursework, and resources while also offering
            personalized tools and support to help students stay organized, engaged, and motivated
            throughout their university journey.
          </p>
          <p class="description">
            We believe that university life should be easier to navigate for every NTU student.
            Through our platform, we aim to build a supportive community where students can
            efficiently manage their academic tasks, track their progress, and collaborate with
            peers—helping them stay on top of their studies and thrive both academically and
            personally.
          </p>
        </section>

        <!-- Team Section -->
        <section class="team-section">
          <h2 class="section-title">Our Team</h2>
          <div class="team-grid">
            <div class="team-member">
              <div class="member-avatar">
                <span class="avatar-text">TM</span>
              </div>
              <h3 class="member-name">T Maruthuvel</h3>
              <p class="member-role">Backend Developer</p>
            </div>

            <div class="team-member">
              <div class="member-avatar">
                <span class="avatar-text">SY</span>
              </div>
              <h3 class="member-name">Sivakumar Yasuvanthi</h3>
              <p class="member-role">Frontend Developer</p>
            </div>

            <div class="team-member">
              <div class="member-avatar">
                <span class="avatar-text">UM</span>
              </div>
              <h3 class="member-name">Umasankar Mugunthan</h3>
              <p class="member-role">Frontend Developer</p>
            </div>

            <div class="team-member">
              <div class="member-avatar">
                <span class="avatar-text">YSL</span>
              </div>
              <h3 class="member-name">Yves Samson Li</h3>
              <p class="member-role">Backend Developer</p>
            </div>

            <div class="team-member">
              <div class="member-avatar">
                <span class="avatar-text">TM</span>
              </div>
              <h3 class="member-name">Zhou Wenkai</h3>
              <p class="member-role">Backend Developer</p>
            </div>
          </div>
        </section>

        <!-- Terms & Conditions -->
        <section class="terms-section">
          <h2 class="section-title">Terms and Conditions</h2>
          <div class="terms-content">
            <h3 class="terms-subtitle">1. Acceptance of Terms</h3>
            <p class="terms-text">
              By accessing and using StudyWell, you agree to be bound by these Terms and Conditions.
              If you do not agree with any part of these terms, you may not use our service.
            </p>

            <h3 class="terms-subtitle">2. User Accounts</h3>
            <p class="terms-text">
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activities that occur under your account. You must notify us immediately
              of any unauthorized use of your account.
            </p>

            <h3 class="terms-subtitle">3. User Content</h3>
            <p class="terms-text">
              You retain all rights to the content you upload to StudyWell. By uploading content,
              you grant us a license to use, store, and display your content solely for the purpose
              of providing our services to you.
            </p>

            <h3 class="terms-subtitle">4. Privacy</h3>
            <p class="terms-text">
              We are committed to protecting your privacy. Your personal information will be used
              only to provide and improve our services. We will never sell your data to third
              parties.
            </p>

            <h3 class="terms-subtitle">5. Acceptable Use</h3>
            <p class="terms-text">
              You agree not to use StudyWell for any unlawful purpose or in any way that could
              damage, disable, or impair our service. You must not attempt to gain unauthorized
              access to our systems.
            </p>

            <h3 class="terms-subtitle">6. Modifications</h3>
            <p class="terms-text">
              We reserve the right to modify these terms at any time. We will notify users of any
              significant changes. Continued use of the service after changes constitutes acceptance
              of the modified terms.
            </p>

            <h3 class="terms-subtitle">7. Contact</h3>
            <p class="terms-text">
              If you have any questions about these Terms and Conditions, please contact us at
              support@studywell.com
            </p>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section">
          <h2 class="cta-title">Ready to Start Your Learning Journey?</h2>
          <router-link to="/login">
            <button class="cta-button">Get Started Today</button>
          </router-link>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import NavbarComponent from '@/components/NavbarComponent.vue'
import { ElButton } from 'element-plus'
</script>

<script>
export default {
  name: 'AboutPage',
  components: {},
}
</script>

<style scoped>
.about-page-bg {
  min-height: 100vh;
  width: 100%;
  background: url('/login-bg.jpg') no-repeat center center fixed;
  background-size: cover;
}

.navbar-fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}

.login-button {
  background-color: #466aff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  height: 40px;
  width: 100px;
}

.login-text {
  color: white;
  text-decoration: none;
  font-weight: 500;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.about-page-content {
  padding-top: 120px;
  padding-bottom: 60px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
}

.content-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 18px;
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.12),
    0 0 15px 5px rgba(255, 255, 255, 0.5);
  padding: 3rem 3rem;
  max-width: 900px;
  width: 90%;
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* About Section */
.about-section {
  margin-bottom: 3rem;
}

.main-title {
  text-align: center;
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1a1a1a;
}

.description {
  font-size: 1.15rem;
  line-height: 1.8;
  color: #444;
  margin-bottom: 1.2rem;
  text-align: justify;
}

/* Team Section */
.team-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: center;
  color: #1a1a1a;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 1rem;
}

.team-member {
  text-align: center;
  padding: 1.5rem;
  background: rgba(249, 250, 251, 0.6);
  border-radius: 12px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.team-member:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(70, 106, 255, 0.2);
}

.member-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #466aff, #3651b7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.avatar-text {
  color: white;
  font-size: 1.8rem;
  font-weight: 600;
}

.member-name {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.member-role {
  font-size: 1rem;
  color: #666;
}

/* Terms Section */
.terms-section {
  margin-bottom: 3rem;
}

.terms-content {
  background: rgba(249, 250, 251, 0.6);
  border-radius: 12px;
  padding: 2rem;
}

.terms-subtitle {
  font-size: 1.3rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.8rem;
  color: #1a1a1a;
}

.terms-subtitle:first-child {
  margin-top: 0;
}

.terms-text {
  font-size: 1.05rem;
  line-height: 1.7;
  color: #555;
  margin-bottom: 1rem;
}

/* CTA Section */
.cta-section {
  text-align: center;
  padding: 2rem 0 1rem;
}

.cta-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #1a1a1a;
}

.cta-button {
  background-color: #466aff;
  color: white;
  padding: 1rem 2.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.2s;
}

.cta-button:hover {
  background-color: #3651b7;
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .content-box {
    padding: 2rem 1.5rem;
    width: 95%;
  }

  .main-title {
    font-size: 2.2rem;
  }

  .section-title {
    font-size: 1.8rem;
  }

  .team-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5rem;
  }

  .terms-content {
    padding: 1.5rem;
  }
}
</style>
